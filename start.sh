if screen -list | grep -q "d1"; then
  echo "d1 already started"
  exit 1
else
  echo "starting d1"
fi

. /media/sda1/deployment/ports.sh

# Start node server
screen -dmS 'd1'
screen -S 'd1' -X stuff "cd api && node .\n"

echo "Checking if node started..."
lsof -i:$d1

# Build vue client
# yarn build