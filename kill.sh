if ! screen -list | grep -q 'd1'; then
  echo 'd1 already killed'
  exit 1
else
  echo "killing d1"
fi
. /media/sda1/deployment/ports.sh
screen -S 'd1' -X quit
echo "Checking if d1 still alive..."
lsof -i:$d1