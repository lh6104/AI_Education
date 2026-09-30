#!/usr/bin/env python3
"""
Simple runner script to execute read_users.py
Usage: python run_read_users.py
"""

import subprocess
import sys
import os


def main():
    """Run the read_users script"""
    # Get the scripts directory
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Path to read_users.py in the scripts directory (same as this file)
    script_path = os.path.join(script_dir, "read_users.py")

    if not os.path.exists(script_path):
        print(f"❌ read_users.py not found at: {script_path}")
        print(f"📁 Looking in: {script_dir}")
        return 1

    try:
        # Run the script from scripts directory
        # read_users.py will automatically find dev.db in parent directory
        result = subprocess.run([sys.executable, script_path], cwd=script_dir)
        return result.returncode
    except KeyboardInterrupt:
        print("\n👋 Interrupted by user")
        return 0
    except Exception as e:
        print(f"❌ Error running script: {e}")
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
