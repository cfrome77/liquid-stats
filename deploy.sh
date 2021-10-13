usage () {
    cat<<-EOF
aws_deploy_stack (-t|--template) <template file> (-s|--stackname) <stack name> [(-p|-params|--parameters) <parameters_file>] [(-a|--tags) <tags file>] [(-d|--dryrun)] [(-h|--help)]
    REQUIRED PARAMETERS:
        (-t|--template) <template file> - template file to deploy
        (-s|--stackname) <stack name> - name to use for the CFN stack
    OPTIONAL PARAMETERS:
        (-p|--params|--parameters) <parameters file> - template parameters
        (-a|--tags) <tags file> - CFN stack tags
        (-d|dryrun) - Generate the aws cloudformation deploy command but do not execute it 
        (-h|--help) - Display this help
EOF
}

parse_yaml () {
    local YAML_FILE=${1}
    local PARAM_TO_SET=${2}
    
    if [[ ! -f ${YAML_FILE} ]]
    then 
        echo "ERROR: Unable to find file '${YAML_FILE}' for parsing!"
        exit 1
    fi

    # ok, this'll need a bit of explaining :) 
    # cat ${YAML_FILE} - read the file
    # grep -v -e '---'  - ignore any lines with '---' (well formed yaml)'
    # grep -v '#' - ignore any comments
    # sed -e "s/:[^:\/\/]/='/g;s/$/'/g;s/ *=/=/g" - sed magic to replace ': ' with '=' and enclose the value in single quotes
    # tr '\n' ' ' - replace newlines with spaces cos we want everything on one line
    local output=$(cat ${YAML_FILE}|grep -v -e '---'|grep -v '#'|sed -e "s/:[^:\/\/]/='/g;s/$/'/g;s/ *=/=/g"|tr '\n' ' ')
    # echo "OUTPUT: ${output}"
    eval "${PARAM_TO_SET}=\"${output}\""
}

while (( $# ));
do
    case "${1}" in
        -t|--template)              shift; TEMPLATE_FILE=$1;;
        -p|--params|--parameters)   shift; PARAMETERS_FILE=$1;;
        -a|--tags)                  shift; TAGS_FILE=$1;;
        -d|--dryrun)                DRY_RUN=true;;
        -s|--stackname)             shift; STACK_NAME=$1;;
        -h|--help)                  usage; exit 0;;
        --)                         break;; #end parsing
        *)                          echo "Unknown option '${1}'"; exit 1;;
    esac
    shift
done    

# echo params so people know what they're setting
cat <<-EOF
=====================
PARAMETERS:
template:   ${TEMPLATE_FILE:-Not Set}
stackname:  ${STACK_NAME:-Not Set}
parameters: ${PARAMETERS_FILE:-Not Set}
tags:       ${TAGS_FILE:-Not Set}
dryrun:     ${DRY_RUN:-false}
=====================
EOF

# validate required params
if [[ ! -f ${TEMPLATE_FILE} ]]
then
    echo "ERROR: template '${TEMPLATE_FILE}' does not exist!'"
    exit 1
fi

if [[ -z "${STACK_NAME}" ]]
then 
    echo "ERROR: stack name not set!"
    exit 1
fi

if [[ -n ${PARAMETERS_FILE} ]]
then
    echo "Parsing parameters file"
    parse_yaml ${PARAMETERS_FILE} STACK_PARAMS
fi

if [[ -n ${TAGS_FILE} ]]
then
    echo "Parsing tags file"
    parse_yaml ${TAGS_FILE} STACK_TAGS
fi

# echo "STACK_PARAMS: '${STACK_PARAMS}'"
# echo "STACK_TAGS: '${STACK_TAGS}'"

aws_command="aws cloudformation deploy \\
    --template-file ${TEMPLATE_FILE} \\
    --stack-name ${STACK_NAME} \\
    --capabilities CAPABILITY_IAM \\
    --no-fail-on-empty-changeset"

cat <<- EOC
=====================
AWS COMMAND:
${aws_command}
=====================
EOC

if [[ -z ${DRY_RUN} ]]
then
    # echo "Doin' the AWS thang!"
    eval "${aws_command}"
else
    echo "DRYRUN: not executing anything."
fi
