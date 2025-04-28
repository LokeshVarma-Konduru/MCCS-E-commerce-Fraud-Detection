import os
import boto3
import configparser
import sys

def configure_aws_credentials(aws_access_key_id=None, aws_secret_access_key=None, aws_region=None):
    """
    Configure AWS credentials either through environment variables or by creating/updating
    the AWS credentials file.
    
    Args:
        aws_access_key_id (str, optional): AWS access key ID
        aws_secret_access_key (str, optional): AWS secret access key
        aws_region (str, optional): AWS region (default: 'us-west-2')
    
    Returns:
        bool: True if credentials were configured successfully, False otherwise
    """
    # Set default region if not provided
    if not aws_region:
        aws_region = 'us-west-2'
    
    # Try to use environment variables if credentials are provided
    if aws_access_key_id and aws_secret_access_key:
        os.environ['AWS_ACCESS_KEY_ID'] = aws_access_key_id
        os.environ['AWS_SECRET_ACCESS_KEY'] = aws_secret_access_key
        os.environ['AWS_DEFAULT_REGION'] = aws_region
        return True
    
    # Check if credentials are already set in environment variables
    if os.environ.get('AWS_ACCESS_KEY_ID') and os.environ.get('AWS_SECRET_ACCESS_KEY'):
        return True
    
    # Check if credentials file exists and has default profile
    credentials_path = os.path.expanduser('~/.aws/credentials')
    if os.path.exists(credentials_path):
        config = configparser.ConfigParser()
        config.read(credentials_path)
        if 'default' in config and 'aws_access_key_id' in config['default'] and 'aws_secret_access_key' in config['default']:
            return True
    
    print("AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.", file=sys.stderr)
    return False

def test_s3_connection(bucket_name='cs5926-g1-s3'):
    """
    Test the connection to the specified S3 bucket.
    
    Args:
        bucket_name (str): Name of the S3 bucket to test
    
    Returns:
        bool: True if connection is successful, False otherwise
    """
    try:
        # Create an S3 client
        s3_client = boto3.client('s3')
        
        # Try to list objects in the bucket
        response = s3_client.list_objects_v2(Bucket=bucket_name, MaxKeys=1)
        
        # If we get here, the connection was successful
        print(f"Successfully connected to S3 bucket: {bucket_name}")
        return True
    except Exception as e:
        print(f"Error connecting to S3 bucket: {str(e)}", file=sys.stderr)
        return False

if __name__ == "__main__":
    # Configure AWS credentials
    if configure_aws_credentials():
        # Test S3 connection
        test_s3_connection()
    else:
        print("Failed to configure AWS credentials. Please set them manually.", file=sys.stderr)
