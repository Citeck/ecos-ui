timestamps {
  node {
    mattermostSend endpoint: 'https://mm.citeck.ru/hooks/9ytch3uox3retkfypuq7xi3yyr', channel: "build_notifications", color: 'good', message: " :arrow_forward: Build info - ${env.JOB_NAME} ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)"
    try {
      stage('Checkout SCM') {
        checkout([
          $class: 'GitSCM',
          branches: [[name: "${env.BRANCH_NAME}"]],
          doGenerateSubmoduleConfigurations: false,
          extensions: [],
          submoduleCfg: [],
          userRemoteConfigs: [[credentialsId: 'bc074014-bab1-4fb0-b5a4-4cfa9ded5e66',url: 'git@bitbucket.org:citeck/ecos-ui.git']]
        ])
      }
      stage('Assembling and publishing project artifacts') {
        withMaven(mavenLocalRepo: '/opt/jenkins/.m2/repository', tempBinDir: '') {
          sh "yarn && yarn build"
          def build_info = [:]
          def build_timestamp = LocalDateTime.now()
          def package_props = readJSON file:("package.json")
          build_info.putAll(package_props.version)
          build_info.putAll['timestamp':"${build_timestamp}"]
          writeJSON(file: 'build/build-info.json', json: build_info, pretty: 4)
          fileOperations([folderCopyOperation(destinationFolderPath: '/opt/ecos-ui-static/'+"${env.BRANCH_NAME}", sourceFolderPath: "build")])
        }
      }
      stage('Building an ecos-ui docker images') {
        build job: 'build_ecos_ui_image', parameters: [
          string(name: 'DOCKER_BUILD_DIR', value: 'ecos-ui'), 
          string(name: 'ECOS_UI_BRANCH', value: "${env.BRANCH_NAME}")
        ]
      }
    }
    catch (Exception e) {
      currentBuild.result = 'FAILURE'
      error_message = e.getMessage()
      echo error_message
    }
    script{
      if(currentBuild.result != 'FAILURE'){
        mattermostSend endpoint: 'https://mm.citeck.ru/hooks/9ytch3uox3retkfypuq7xi3yyr', channel: "build_notifications", color: 'good', message: " :white_check_mark: Build complete - ${env.JOB_NAME} ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)"
      }
      else{
        mattermostSend endpoint: 'https://mm.citeck.ru/hooks/9ytch3uox3retkfypuq7xi3yyr', channel: "build_notifications", color: 'danger', message: " @channel :exclamation: Build failure - ${env.JOB_NAME} ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>) :\n${error_message}"
      }
    }
  }
}