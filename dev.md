## api
### start
```bash
docker-compose up -d --build
```

### stop
```bash
docker-compose down
```

### show logs
```bash
docker logs -f pp-api
```

## database (mongodb)
### start
```bash
docker-compose -f docker-compose-db.yaml up -d
```

### stop
```bash
docker-compose -f docker-compose-db.yaml down
```