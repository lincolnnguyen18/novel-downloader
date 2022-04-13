if ! screen -list | grep -q 'p1'; then
  echo 'p1 already killed'
  exit 1
else
  echo "killing p1"
fi
# echo "Checking if p1 still alive..."
# lsof -i:6001
# if lsof -i:6001; then
#   echo "p1 not killed"
# else
#   echo "p1 killed"
#   screen -S 'p1' -X quit
# fi

screen -S 'p1' -X quit

while lsof -i:6001; do
  # echo "p1 not killed"
  lsof -i:6001 | awk 'FNR == 2 {print $2}' | xargs kill -9
done