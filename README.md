# TRPC TCP example usage

## This is just proof of concept and many violations and drawbacks

## Install dependencies
`pnpm install`

## First start the server
`clear && pn exec tsx server.ts`

## Then start the client in separate terminal window
`clear && pn exec tsx client.ts`

### Motivation

I was using Nest.js for microservices communication, but due to lack of docs you do not know What Nest.js does under the hood and type safety and DX was far from enjoyable. Idea is to use TRPC for server to server communication.