#!/bin/zsh
#
# This file was used to quickly create a token for testing swap program
# For development purposes only
#
# Usage: ./create-token.sh <mint_amount>

AMOUNT=$1
URL=$2

if [ "$AMOUNT" = "" ]
then
  echo "Missing params"
  echo "Usage: ./create-token.sh <mint_amount>"
	exit 1
fi

if [ "$URL" = "" ]
then
  URL="localhost"
fi

echo "Minting $AMOUNT token on $URL ... "
echo ""

alias spl-token-local="spl-token --url $URL"
spl-token-local create-token --decimals 9

echo "Paste token address here: "
read TMA
echo ""
echo ""

spl-token-local create-account $TMA
spl-token-local mint $TMA $AMOUNT
echo "Supply: "
spl-token-local supply $TMA
echo "Balance: "
spl-token-local balance $TMA
echo "All Done!"
