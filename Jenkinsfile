properties([
    buildDiscarder(logRotator(daysToKeepStr: '', numToKeepStr: '7')),
])
timestamps {
  node {

    def repoUrl = "git@bitbucket.org:citeck/ecos-ui.git"
    def mavenRepository = "maven-snapshots"

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
    def buildTools = load "jenkins-script-tools/scripts/build-tools.groovy"

    try {

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

      def package_props = readJSON file:("package.json")
      def project_version = package_props.version

      buildTools.notifyBuildStarted(repoUrl, project_version, env)

      if ((env.BRANCH_NAME != "master") && (!package_props.version.contains('snapshot')))  {
        echo "Assembly of release artifacts is allowed only from the master branch!"
        currentBuild.result = 'FAILURE'
        return
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

          if (env.BRANCH_NAME == "master") {
            mavenRepository = "maven-releases"
          }

          sh "gradle publish -PmavenUser=jenkins -PmavenPass=po098765 -PmavenUrl='http://127.0.0.1:8081/repository/${mavenRepository}/'"

        }
      }

      stage('Building an ecos-proxy-odic docker images') {
        build job: 'build_ecos_ui_image', parameters: [
          string(name: 'DOCKER_BUILD_DIR', value: 'ecos-proxy-oidc'),
          string(name: 'ECOS_UI_VERSION', value: project_version.toUpperCase())
        ]
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
