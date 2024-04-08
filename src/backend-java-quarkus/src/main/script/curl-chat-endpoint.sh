#!/usr/bin/env bash
##############################################################################
# Usage: ./curl-chat-endpoint.sh
# Curls the Chat Endpoint with a POST request
##############################################################################

curl -X 'POST' \
'http://localhost:3000/chat' \
-H 'accept: */*' \
-H 'Content-Type: application/json' \
-d '{
  "messages": [
    {
      "content": "What is the information that is collected automatically?",
      "role": "user"
    }
  ],
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "topP": 0.5,
  "user": "joedoe"
}'
