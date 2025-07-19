# Trackit

## Local Development

### Using npm

```bash
npm install
npm start
```

## Using Docker

### Build the Docker image

```bash
docker build -t react_app .
```

### Run the container

```bash
docker run -d \
  --name react_app \
  -p 3000:3000 \
  --restart always \
  -e ADMIN_USERNAME=myadmin \
  -e ADMIN_PASSWORD=mypassword \
  -e NODE_ENV=production \
  react_app
```
