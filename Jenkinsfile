pipeline {
  node {
    stage('build static files') {
      sh "npm install -g yarn"
      sh "yarn"
      sh "yarn build"
      }
      stage('build and publish docker image') {
        sh "docker build -t nexus.cinteck.ru/ecos-${ECOS}-web:${VERSION} -t nexus.cinteck.ru/ecos-${ECOS}-web:latest  ./"
        sh "docker push nexus.cinteck.ru/ecos-${ECOS}-web"
      }
      stage('build compose file') {
        sh "sed '0,/image: nexus.citeck.ru\\/ecos-.*/s/image: nexus.citeck.ru\\/ecos-.*/image: nexus.citeck.ru\\/ecos-'${ECOS}':'${VERSION}'/' docker-compose.yaml > target/docker-compose.yaml"
        sh "sed -i 's/image: nexus.citeck.ru\\/ecos-.*-ui-.*/image: nexus.citeck.ru\\/ecos-'${ECOS}'-ui:'${VERSION}'/' target/docker-compose.yaml > target/docker-compose.yaml"
        readFile("target/docker-compose.yaml")
      }
    }
  }
