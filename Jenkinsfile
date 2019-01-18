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
        withCredentials([usernamePassword(credentialsId: '3400f5ec-0ef3-4944-b59a-97e67680777a', passwordVariable: 'pass', usernameVariable: 'user')]) {
          sh "docker login -u $user -p $pass nexus.citeck.ru"
          sh "docker build -t nexus.citeck.ru/ecos-${params.ECOS}-web:${params.VERSION} -t nexus.citeck.ru/ecos-${params.ECOS}-web:latest  ./"
          sh "docker push nexus.citeck.ru/ecos-${params.ECOS}-web"
        }
      }
    }
    stage('build compose file') {
      steps {
        sh "sed '0,/image: nexus.citeck.ru\\/ecos-.*/s/image: nexus.citeck.ru\\/ecos-.*/image: nexus.citeck.ru\\/ecos-'${params.ECOS}':'${params.VERSION}'/' docker-compose.yaml > build/docker-compose.yaml"
        sh "sed -i 's/image: nexus.citeck.ru\\/ecos-.*-web:.*/image: nexus.citeck.ru\\/ecos-'${params.ECOS}'-web:'${params.VERSION}'/' build/docker-compose.yaml > build/docker-compose.yaml"
        echo(readFile("build/docker-compose.yaml"))
      }
    }
  }
}
