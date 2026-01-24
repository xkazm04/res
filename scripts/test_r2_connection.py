"""Test script to verify Cloudflare R2 connection."""

import os
import sys
from pathlib import Path

# Add actor/src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "actor" / "src"))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from clients.r2 import R2Client


def test_r2_connection():
    """Test R2 connection by uploading a simple test file."""

    # Get credentials from environment
    account_id = os.getenv("R2_ACCOUNT_ID")
    access_key_id = os.getenv("R2_ACCESS_KEY_ID")
    secret_access_key = os.getenv("R2_SECRET_ACCESS_KEY")
    bucket_name = os.getenv("R2_BUCKET_NAME")

    print("R2 Configuration:")
    print(f"  Account ID: {account_id[:8]}...{account_id[-4:]}" if account_id else "  Account ID: NOT SET")
    print(f"  Access Key: {access_key_id[:8]}...{access_key_id[-4:]}" if access_key_id else "  Access Key: NOT SET")
    print(f"  Secret Key: {'*' * 20}" if secret_access_key else "  Secret Key: NOT SET")
    print(f"  Bucket: {bucket_name}")
    print()

    if not all([account_id, access_key_id, secret_access_key, bucket_name]):
        print("ERROR: Missing R2 credentials in .env file")
        return False

    try:
        # Initialize client
        print("Initializing R2 client...")
        client = R2Client(
            account_id=account_id,
            access_key_id=access_key_id,
            secret_access_key=secret_access_key,
            bucket_name=bucket_name,
        )
        print("  Client initialized successfully")

        # Generate a test job ID
        job_id = client.generate_job_id("R2 Connection Test", "test")
        print(f"  Generated job ID: {job_id}")

        # Upload a placeholder
        print("\nUploading test placeholder...")
        url = client.upload_placeholder(
            job_id=job_id,
            query="R2 Connection Test - This is a test to verify credentials work",
            template="test",
        )
        print(f"  Placeholder uploaded successfully!")
        print(f"  URL: {url}")

        # Verify it exists
        print("\nVerifying upload...")
        exists = client.check_report_exists(job_id)
        print(f"  Report exists: {exists}")

        # Upload a simple HTML report
        print("\nUploading test HTML report...")
        test_html = """<!DOCTYPE html>
<html>
<head><title>R2 Test Report</title></head>
<body>
<h1>R2 Connection Test Successful!</h1>
<p>This report was uploaded to verify R2 credentials are working correctly.</p>
<p>Timestamp: """ + str(__import__('datetime').datetime.utcnow()) + """</p>
</body>
</html>"""

        url = client.upload_report(job_id=job_id, html_content=test_html)
        print(f"  Report uploaded successfully!")
        print(f"  URL: {url}")

        # Clean up (optional - comment out to keep test file)
        # print("\nCleaning up test files...")
        # client.delete_report(job_id)
        # print("  Test files deleted")

        print("\n" + "=" * 50)
        print("R2 CONNECTION TEST: SUCCESS")
        print("=" * 50)
        print(f"\nYou can view the test report at:\n{url}")
        return True

    except Exception as e:
        print(f"\nERROR: {type(e).__name__}: {e}")
        print("\n" + "=" * 50)
        print("R2 CONNECTION TEST: FAILED")
        print("=" * 50)
        return False


if __name__ == "__main__":
    success = test_r2_connection()
    sys.exit(0 if success else 1)
