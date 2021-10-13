import json
import os
import subprocess

from dotenv import load_dotenv
from subprocess import check_output, Popen, PIPE

load_dotenv()

# Accessing variables.
CLIENT_ID = os.environ.get('CLIENT_ID')
CLIENT_SECRET = os.environ.get('CLIENT_SECRET')
USERNAME = os.environ.get('USERNAME')
BUCKET_NAME = os.environ.get('BUCKET_NAME')


def get_lambda_functions():
    function_dict = {}
    res = subprocess.Popen(
        ["aws", "lambda", "list-functions"],
        stdout=subprocess.PIPE
    )
    output = res.communicate()
    function_dict.update(json.loads(output[0]))

    return function_dict['Functions']


lambda_functions = get_lambda_functions()
for lambda_function in lambda_functions:
    function_name = lambda_function['FunctionName']

    subprocess.run([
        "aws", "lambda", "update-function-configuration",
        "--function-name", f"{function_name}", "--environment",
        f"Variables={{CLIENT_ID={CLIENT_ID},CLIENT_SECRET={CLIENT_SECRET},USERNAME={USERNAME},BUCKET_NAME={BUCKET_NAME}}}"
    ])
