.PHONY: docker/build docker/push

NAME=raptorbox/auth

docker/build:
	docker build . -t ${NAME}

docker/push: docker/build
	docker push ${NAME}:latest
