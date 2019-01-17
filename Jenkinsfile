pipeline {
  agent any
  parameters {
    string(name: 'ECOS', defaultValue: 'community')
    string(name: 'VERSION', defaultValue: '3.8.0-snapshot')
  }
  stages{
    stage('build static files') {
      steps {
        sh "yarn"
        sh "yarn build"
      }
    }
    stage('build and publish docker image') {
      steps {
        sh "docker build -t nexus.citeck.ru/ecos-${params.ECOS}-web:${params.VERSION} -t nexus.citeck.ru/ecos-${params.ECOS}-web:latest  ./"
        sh "docker push nexus.citeck.ru/ecos-${params.ECOS}-web"
      }
    }
    stage('build compose file') {
      steps {
        sh "sed '0,/image: nexus.citeck.ru\\/ecos-.*/s/image: nexus.citeck.ru\\/ecos-.*/image: nexus.citeck.ru\\/ecos-'${params.ECOS}':'${params.VERSION}'/' docker-compose.yaml > target/docker-compose.yaml"
        sh "sed -i 's/image: nexus.citeck.ru\\/ecos-.*-ui-.*/image: nexus.citeck.ru\\/ecos-'${params.ECOS}'-ui:'${params.VERSION}'/' target/docker-compose.yaml > target/docker-compose.yaml"
        readFile("target/docker-compose.yaml")
      }
    }
  }
}
