@NonCPS
import groovy.json.JsonOutput
import groovy.json.JsonSlurperClassic
import java.text.SimpleDateFormat

//Get Log sets func
properties([
    buildDiscarder(logRotator(daysToKeepStr: '', numToKeepStr: '7')),
])
timestamps {
  node {
    def repoUrl = "git@bitbucket.org:citeck/ecos-ui.git"
    try {
      stage('Checkout Script Tools SCM') {
        dir('jenkins-script-tools') {
          checkout([
            $class: 'GitSCM',
            branches: [[name: "script-tools"]],
            doGenerateSubmoduleConfigurations: false,
            extensions: [],
            submoduleCfg: [],
            userRemoteConfigs: [[credentialsId: 'bc074014-bab1-4fb0-b5a4-4cfa9ded5e66', url: 'git@bitbucket.org:citeck/pipelines.git']]
          ])
        }
      }
      currentBuild.changeSets.clear()
      stage('Checkout SCM') {
        checkout([
          $class: 'GitSCM',
          branches: [[name: "${env.BRANCH_NAME}"]],
          doGenerateSubmoduleConfigurations: false,
          extensions: [],
          submoduleCfg: [],
          userRemoteConfigs: [[credentialsId: 'bc074014-bab1-4fb0-b5a4-4cfa9ded5e66', url: repoUrl]]
        ])
      }
      def buildTools = load "jenkins-script-tools/scripts/build-tools.groovy"

      def package_props = readJSON file:("package.json")
      def project_version = package_props.version

      buildTools.notifyBuildStarted(repoUrl, project_version, currentBuild.changeSets, env)

      if ((env.BRANCH_NAME != "master") && (!package_props.version.contains('snapshot')))  {
        echo "Assembly of release artifacts is allowed only from the master branch!"
        currentBuild.result = 'FAILURE'
        return
      }
      stage('Assembling and publishing project artifacts') {
        withMaven(mavenLocalRepo: '/opt/jenkins/.m2/repository', tempBinDir: '') {
          sh "yarn && CI=true yarn test && yarn build"
          def build_info = [:]
          build_info.put("version", "${package_props.version}")
          def jsonOut = readJSON text: groovy.json.JsonOutput.toJson(build_info)
          writeJSON(file: 'build/build-info.json', json: jsonOut, pretty: 2)
          // build-info
          def buildData = buildTools.getBuildInfo(repoUrl, "${env.BRANCH_NAME}", project_version)
          dir('build/build-info') {
              buildTools.writeBuildInfoToFiles(buildData)
          }
          // /build-info
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
    } catch (Exception e) {
      currentBuild.result = 'FAILURE'
      error_message = e.getMessage()
      echo error_message
    }
    script {
      if (currentBuild.result != 'FAILURE') {
        notifyBuildSuccess(repoUrl, env)
      } else {
        notifyBuildFailed(repoUrl, error_message, env)
      }
    }
  }
}
