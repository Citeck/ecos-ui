@NonCPS
import groovy.json.JsonOutput
import groovy.json.JsonSlurperClassic

def getChangeLogSetsMap() {
  MAX_MSG_LEN = 100
  def changeLogSets = currentBuild.changeSets
  def changeLogSetsMap = [commits:[]]
  if (changeLogSets.size() > 0) {
    for (int i = 0; i < changeLogSets.size(); i++) {
      def entries = changeLogSets[i].items
      for (int j = 0; j < entries.length; j++) {
        def entry = entries[j]
        truncated_msg = entry.msg.take(MAX_MSG_LEN)
        changeLogSetsMap.commits.add([ author: "${entry.author}", commit: "${entry.commitId}", message: "${truncated_msg}", date: "${entry.date}"])
      }
    }
  }
  return changeLogSetsMap
}
//Get Log sets func
properties([
    buildDiscarder(logRotator(daysToKeepStr: '', numToKeepStr: '7')),
])
timestamps {
  node {
    def project_id = "ecos-ui"
    def changeLogSetsMessage = " - No new changes"
    def commitCount = 0
    def maxCommitCount = 50
    def tmpText = ""
    justCreated = false
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
      stage('Save change log sets') {
        if (!fileExists("/opt/commits_log/${project_id}/${env.BRANCH_NAME}/full.json")) {
          sh "mkdir -p /opt/commits_log/${project_id}/${env.BRANCH_NAME}"
          justCreated = true
        }
        def currentChangeLogSetsMap = [:]
        currentChangeLogSetsMap = getChangeLogSetsMap()
        if (currentChangeLogSetsMap.commits != []) {
          changeLogSetsMessage = ""
          currentChangeLogSetsMap.commits.each { currenCommit ->
            changeLogSetsMessage += "- [${currenCommit.commit.substring(0,7)}](https://bitbucket.org/citeck/${project_id}/commits/${currenCommit.commit})     ${currenCommit.message}    [ ${currenCommit.author} ]\n"
            commitCount++
          }
          buildDate = new Date().format("yyyy-MM-dd'T'HH:mm:ss'Z'", TimeZone.getTimeZone("UTC")).toString()
          currentChangeLogSetsMap.put("repo", "git@bitbucket.org:citeck/pipelines.git")
          currentChangeLogSetsMap.put("branch", "${env.BRANCH_NAME}")
          currentChangeLogSetsMap.put("date", "${buildDate}")
          if (commitCount < maxCommitCount) {
            def diffCommitCount = maxCommitCount - commitCount
            commitCount = 0
            if (!justCreated) {
              tmpText = new File ("/opt/commits_log/${project_id}/${env.BRANCH_NAME}/full.json").text
              histroryChangeLogSetsMap = new JsonSlurperClassic().parseText(tmpText)
              new File ("/opt/commits_log/${project_id}/${env.BRANCH_NAME}/full.json").delete()
              histroryChangeLogSetsMap.commits.each {currenCommit ->
                  currentChangeLogSetsMap.commits.add([ author: "${currenCommit.author}", commit: "${currenCommit.commit}", message: "${currenCommit.message}", date: "${currenCommit.date}"])
                  commitCount++
                if (commitCount == diffCommitCount) {
                  break
                }
              }
            }
          }
          currentChangeLogSetsJson = JsonOutput.toJson(currentChangeLogSetsMap)
          currentChangeLogSetsJson = JsonOutput.prettyPrint(currentChangeLogSetsJson)
          echo "${currentChangeLogSetsJson}"
          new File("/opt/commits_log/${project_id}/${env.BRANCH_NAME}/full.json").write(currentChangeLogSetsJson)
        }
      }
      def package_props = readJSON file:("package.json")
      def project_version = package_props.version
      mattermostSend endpoint: 'https://mm.citeck.ru/hooks/9ytch3uox3retkfypuq7xi3yyr', channel: "qa-cicd", color: 'good', message: " :arrow_forward: **Build project ${project_id}:**\n**Branch:** ${env.BRANCH_NAME}\n**Version:** ${project_version}\n**Build id:** ${env.BUILD_NUMBER}\n**Build url:** ${env.BUILD_URL}\n**Changes:**\n" + "${changeLogSetsMessage}"
      if ((env.BRANCH_NAME != "master") && (!package_props.version.contains('snapshot')))  {
        echo "Assembly of release artifacts is allowed only from the master branch!"
        currentBuild.result = 'FAILURE'
        return
      }
      stage('Assembling and publishing project artifacts') {
        withMaven(mavenLocalRepo: '/opt/jenkins/.m2/repository', tempBinDir: '') {
          sh "yarn && CI=true yarn test && yarn build"
          sh "mkdir build/build-info"
          fileOperations([fileCopyOperation(excludes: '', flattenFiles: false, includes: "/opt/commits_log/${project_id}/${env.BRANCH_NAME}/full.json", targetLocation: 'build/build-info/full.json')])
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
        mattermostSend endpoint: 'https://mm.citeck.ru/hooks/9ytch3uox3retkfypuq7xi3yyr', channel: "qa-cicd", color: 'good', message: " :white_check_mark: **Build project ${project_id} with ID ${env.BUILD_NUMBER} complete!**"
      }
      else{
        mattermostSend endpoint: 'https://mm.citeck.ru/hooks/9ytch3uox3retkfypuq7xi3yyr', channel: "qa-cicd", color: 'danger', message: " @channel :exclamation: **Build project ${project_id} with ID  ${env.BUILD_NUMBER} failure with message:**\n```${error_message}```"
      }
    }
  }
}
