properties([
    buildDiscarder(logRotator(daysToKeepStr: '', numToKeepStr: '3')),
])
timestamps {
  node {

    def repoUrl = "git@gitlab.citeck.ru:citeck-projects/ecos-ui.git"
    def mavenRepository = "maven-snapshots"

    stage('Checkout Script Tools SCM') {
      dir('jenkins-script-tools') {
        checkout([
          $class: 'GitSCM',
          branches: [[name: "script-tools"]],
          doGenerateSubmoduleConfigurations: false,
          extensions: [],
          submoduleCfg: [],
          userRemoteConfigs: [[credentialsId: 'awx.integrations', url: 'git@gitlab.citeck.ru:infrastructure/pipelines.git']]
        ])
      }
    }
    currentBuild.changeSets.clear()
    def buildTools = load "jenkins-script-tools/scripts/build-tools.groovy"

    try {

      stage('Checkout SCM') {
        checkout([
          $class: 'GitSCM',
          branches: [[name: "${env.BRANCH_NAME}"]],
          doGenerateSubmoduleConfigurations: false,
          extensions: [],
          submoduleCfg: [],
          userRemoteConfigs: [[credentialsId: 'awx.integrations', url: repoUrl]]
        ])
      }

      def package_props = readJSON file:("package.json")
      def project_version = package_props.version

      buildTools.notifyBuildStarted(repoUrl, project_version, env)

      if (!(env.BRANCH_NAME ==~ /master(-\d)?/) && (!project_version.contains('snapshot'))) {
        def tag = ""
        try {
          tag = sh(script: "git describe --exact-match --tags", returnStdout: true).trim()
        } catch (Exception e) {
          // no tag
        }
        def buildStopMsg = ""
        if (tag == "") {
          buildStopMsg = "You should add tag with version to build release from non-master branch. Version: " + project_version
        } else if (tag != project_version) {
          buildStopMsg = "Release tag doesn't match version. Tag: " + tag + " Version: " + project_version
        }
        if (buildStopMsg != "") {
          echo buildStopMsg
          buildTools.notifyBuildWarning(repoUrl, buildStopMsg, env)
          currentBuild.result = 'NOT_BUILT'
          return
        }
      }

      stage('Assembling and publishing project artifacts') {
        withMaven(mavenLocalRepo: '/opt/jenkins/.m2/repository', tempBinDir: '') {
          sh "yarn && CI=true yarn test && yarn build"

          // build-info
          def buildData = buildTools.getBuildInfo(repoUrl, "${env.BRANCH_NAME}", project_version)
          dir('build/build-info') {
              buildTools.writeBuildInfoToFiles(buildData)
          }
          // /build-info

          if (!project_version.contains('snapshot')) {
            mavenRepository = "maven-releases"
          }
          withCredentials([usernamePassword(credentialsId: 'maven.jenkins', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD')]) {
            sh "gradle publish -PmavenUser=$USERNAME -PmavenPass=$PASSWORD -PmavenUrl='http://127.0.0.1:8081/repository/${mavenRepository}/'"
          }
        }
      }

      stage('Building an ecos-proxy-odic docker images') {
        build job: 'build_ecos_ui_image', parameters: [
          string(name: 'DOCKER_BUILD_DIR', value: 'ecos-proxy-oidc'),
          string(name: 'ECOS_UI_VERSION', value: project_version.toUpperCase()),
          string(name: 'ECOS_UI_CONFIG_VERSION', value: 'v5')
        ]
      }

      stage('Clean') {
        sh "yarn clean"
      }

    } catch (Exception e) {
      currentBuild.result = 'FAILURE'
      error_message = e.getMessage()
      echo error_message
    }
    script {
      if (currentBuild.result != 'FAILURE') {
        buildTools.notifyBuildSuccess(repoUrl, env)
      } else {
        buildTools.notifyBuildFailed(repoUrl, error_message, env)
      }
    }
  }
}
