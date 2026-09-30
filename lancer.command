#!/bin/bash

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
    echo
    echo "Node.js n'est pas installé."
    echo
    read -p "Appuie sur Entrée pour fermer..."
    exit 1
fi

node "_admin/server.js"

read -p "Appuie sur Entrée pour fermer..."