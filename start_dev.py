import subprocess
import socket
import time
import sys
import os

def start():
    print("Checking backend dependencies...")
    try:
        import uvicorn
    except ImportError:
        print("Installing uvicorn and requirements...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt", "--break-system-packages"])

    print("Starting FastAPI backend on port 8001...")
    env = os.environ.copy()
    backend_proc = subprocess.Popen([
        sys.executable, "-m", "uvicorn", "backend.app.main:app",
        "--host", "127.0.0.1", "--port", "8001"
    ], env=env)

    print("Waiting for FastAPI backend to be ready on port 8001...")
    for _ in range(60):
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.5)
        result = s.connect_ex(('127.0.0.1', 8001))
        s.close()
        if result == 0:
            print("FastAPI backend is ready!")
            break
        time.sleep(0.5)
    else:
        print("FastAPI backend failed to start in time.")
        backend_proc.kill()
        sys.exit(1)

    print("Starting Vite dev server on port 3000...")
    # Use npx vite so we always find the correct local node_modules binary
    vite_proc = subprocess.Popen([
        "npx", "vite", "--port=3000", "--host=0.0.0.0"
    ], env=env)

    try:
        while True:
            ret_b = backend_proc.poll()
            if ret_b is not None:
                print(f"Backend process exited with code {ret_b}")
                vite_proc.terminate()
                sys.exit(ret_b)
            ret_v = vite_proc.poll()
            if ret_v is not None:
                print(f"Vite process exited with code {ret_v}")
                backend_proc.terminate()
                sys.exit(ret_v)
            time.sleep(1)
    except KeyboardInterrupt:
        print("Shutting down development servers...")
        backend_proc.terminate()
        vite_proc.terminate()
        sys.exit(0)

if __name__ == "__main__":
    start()
