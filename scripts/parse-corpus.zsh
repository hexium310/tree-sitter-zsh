parse_file() {
    local file_path=$1
    shift 1

    awk '
        function next_equal_signs() {
            while (1) {
                if (getline == 0) {
                    exit
                }
                if ($0 ~ /^===+/) {
                    break
                }
            }
        }
        NR == 1 {
            next_equal_signs()
        }
        /^===+/ {
            next_equal_signs()
            if (getline == 0) {
                exit
            }
        }
        /^---+/ {
            next_equal_signs()
            next_equal_signs()
            if (getline == 0) {
                exit
            }
        }
        {
            print
        }
    ' $file_path
}

() {
    local file err
    local files="$(git rev-parse --show-toplevel)/corpus/*.txt"
    for file in ${~files}; do
        if ! err=$(zsh -n <(parse_file $file) 2>&1); then
            status_code=1
            local line_number=${${(ps.:.)err}[2]}
            echo ${file:t2}: ${err#*:*: }

            head -$line_number <(parse_file $file) | tail -1
        fi
    done

    if [[ -z $status_code ]]; then
        echo no parse error
    fi
    return $status_code
}
