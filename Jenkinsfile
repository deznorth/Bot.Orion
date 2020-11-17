pipeline {
  agent {
    docker {
      label 'docker-linux'
      image 'node:lts-alpine'
      args '-u root --privileged -v /var/run/docker.sock:/var/run/docker.sock'
    }
  }
  environment {
    REGISTRY_CREDS = 'proget-user'
    REGISTRY_URI = 'https://proget.deznorth.com'
    PROJECT_NAME = 'bot-orion'
    BUILD_VERSION = "1.0.${new Date().format('yyyMMdd')}.${env.BUILD_NUMBER}-${env.BRANCH_NAME}"
    IMAGE_NAME = "${PROJECT_NAME}:${BUILD_VERSION}".toLowerCase()
  }
  stages {
    stage('Build') {
      steps {
        echo 'Building container image...'
        script {
          dockerInstance = docker.build(IMAGE_NAME)
        }
      }
    }
    stage('Publish') {
      steps {
        echo 'Publishing container image to proget registry...'
        script {
          docker.withRegistry(REGISTRY_URI, REGISTRY_CREDS) {
            dockerInstance.push(BUILD_VERSION)
            dockerInstance.push("latest")
          }
        }
      }
    }
    stage('Deploy') {
      steps {
        echo 'Sending deployment request to Kubernetes...'
      }
    }
  }
}