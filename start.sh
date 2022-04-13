if screen -list | grep -q "p1"; then
  echo "p1 already started"
  exit 1
else
  echo "starting p1"
fi

# Start node server
screen -S p1 -dm bash -c "cd api && node ."

# echo "Checking if node started..."
# lsof -i:6001

# Build vue client
# yarn build