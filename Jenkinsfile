properties([
    buildDiscarder(logRotator(daysToKeepStr: '', numToKeepStr: '7')),
])
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
      def package_props = readJSON file:("package.json")
      if ((env.BRANCH_NAME != "master") && (!package_props.version.contains('snapshot')))  {
        echo "Assembly of release artifacts is allowed only from the master branch!"
        //currentBuild.result = 'SUCCESS'
        //return
      }
      stage('Assembling and publishing project artifacts') {
        withMaven(mavenLocalRepo: '/opt/jenkins/.m2/repository', tempBinDir: '') {
          sh "yarn && yarn test --watchAll=false && yarn build"
          def build_info = [:]
          def build_timestamp = new Date()
          build_info.put("version", "${package_props.version}")
          build_info.put("timestamp","${build_timestamp}")
          def jsonOut = readJSON text: groovy.json.JsonOutput.toJson(build_info)
          writeJSON(file: 'build/build-info.json', json: jsonOut, pretty: 2)
          if (!fileExists("/opt/ecos-ui-static/${env.BRANCH_NAME}")) {
            sh "mkdir -p /opt/ecos-ui-static/${env.BRANCH_NAME}"
          }
          sh "rm -rf /opt/ecos-ui-static/${env.BRANCH_NAME}/*"
          fileOperations([folderCopyOperation(destinationFolderPath: '/opt/ecos-ui-static/'+"${env.BRANCH_NAME}"+'/build', sourceFolderPath: "build")])
        }
      }
      stage('Building an ecos-proxy-odic docker images') {
        build job: 'build_ecos_ui_image', parameters: [
          string(name: 'DOCKER_BUILD_DIR', value: 'ecos-proxy-oidc'),
          string(name: 'ECOS_UI_BRANCH', value: "${env.BRANCH_NAME}")
        ]
      }
      stage('Building an ecos-proxy docker images') {
        build job: 'build_ecos_ui_image', parameters: [
          string(name: 'DOCKER_BUILD_DIR', value: 'ecos-proxy'),
          string(name: 'ECOS_UI_BRANCH', value: "${env.BRANCH_NAME}")
        ]
      }
      stage('Building an ecos-proxy docker images') {
        build job: 'build_ecos_ui_image', parameters: [
          string(name: 'DOCKER_BUILD_DIR', value: 'ecos-proxy-ssg'),
          string(name: 'ECOS_UI_BRANCH', value: "${env.BRANCH_NAME}")
        ]
      }
      stage('Transfer artifacts to Unilever Jenkins') {
        build job: 'artifact_transfer_to_unilever_jenkins', parameters: [
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
