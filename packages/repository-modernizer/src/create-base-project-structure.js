/*
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const {
    constants: commons_constants,
    util,
    logger,
    ConversionStep,
    ConversionOperation,
} = require("@adobe/aem-cs-source-migration-commons");
const pomManipulationUtil = require("./util/pom-manipulation-util");
const constants = require("./util/constants");
const path = require("path");
const fs = require("fs");
const fsExtra = require("fs-extra");
const pomParser = require("node-pom-parser");

var CreateBaseProjectStructure = {
    /**
     *
     * @param object config yaml object containing info of project to be restructured
     * @param String basePath root path of project to be restructured
     * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
     *
     * Create base structure for Project to be restructured
     */
    async create(config, basePath = "", conversionSteps) {
        let conversionStep = new ConversionStep(
            "Create base project structure",
            "Create `ui.apps` and `ui.content` base packages for splitting existing mixed content package." +
                " Create an `all` container package for including the ui.apps and ui.content packages as embeds."
        );
        let projects = config.projects;
        let allPackagePomFile = "",
            analysePackagePomFile = "";
        // if there are more than one project, create the all package at the projects' root level
        if (projects.length > 1) {
            fsExtra.copySync(
                path.join(basePath, constants.BASE_ALL_PACKAGE),
                path.join(
                    commons_constants.TARGET_PROJECT_SRC_FOLDER,
                    constants.ALL
                )
            );
            conversionStep.addOperation(
                new ConversionOperation(
                    commons_constants.ACTION_ADDED,
                    path.join(
                        commons_constants.TARGET_PROJECT_SRC_FOLDER,
                        constants.ALL
                    ),
                    "Created `all` container package"
                )
            );
            logger.info(
                "CreateBaseProjectStructure: Base `all` package created at " +
                    commons_constants.TARGET_PROJECT_SRC_FOLDER
            );
            fsExtra.copySync(
                path.join(basePath, constants.BASE_ANALYSE_PACKAGE),
                path.join(
                    commons_constants.TARGET_PROJECT_SRC_FOLDER,
                    constants.ANALYSE
                )
            );
            conversionStep.addOperation(
                new ConversionOperation(
                    commons_constants.ACTION_ADDED,
                    path.join(
                        commons_constants.TARGET_PROJECT_SRC_FOLDER,
                        constants.ANALYSE
                    ),
                    "Created `analyse` package"
                )
            );
            logger.info(
                "CreateBaseProjectStructure: Base `analyse` package created at " +
                    commons_constants.TARGET_PROJECT_SRC_FOLDER
            );
            allPackagePomFile = path.join(
                commons_constants.TARGET_PROJECT_SRC_FOLDER,
                constants.ALL,
                constants.POM_XML
            );
            analysePackagePomFile = path.join(
                commons_constants.TARGET_PROJECT_SRC_FOLDER,
                constants.ANALYSE,
                constants.POM_XML
            );
            fs.copyFileSync(
                path.join(basePath, constants.BASE_PARENT_POM),
                path.join(
                    commons_constants.TARGET_PROJECT_SRC_FOLDER,
                    constants.POM_XML
                )
            );
            conversionStep.addOperation(
                new ConversionOperation(
                    commons_constants.ACTION_ADDED,
                    path.join(
                        commons_constants.TARGET_PROJECT_SRC_FOLDER,
                        constants.POM_XML
                    ),
                    "Created base parent pom.xml"
                )
            );
            logger.info(
                "CreateBaseProjectStructure: Base parent pom.xml created at " +
                    commons_constants.TARGET_PROJECT_SRC_FOLDER
            );
        }
        // create the base packages for all projects
        for (const project of projects) {
            let projectPath = path.join(
                commons_constants.TARGET_PROJECT_SRC_FOLDER,
                path.basename(project.projectPath)
            );
            // recursively create the folders if not present
            fs.mkdirSync(projectPath, { recursive: true });
            if (projects.length == 1) {
                // else create the all package at the same level
                fsExtra.copySync(
                    path.join(basePath, constants.BASE_ALL_PACKAGE),
                    path.join(projectPath, constants.ALL)
                );
                conversionStep.addOperation(
                    new ConversionOperation(
                        commons_constants.ACTION_ADDED,
                        path.join(projectPath, constants.ALL),
                        "Created `all` container package"
                    )
                );
                logger.info(
                    `CreateBaseProjectStructure: Base all package created at ${projectPath}.`
                );
                allPackagePomFile = path.join(
                    projectPath,
                    constants.ALL,
                    constants.POM_XML
                );
                // create the analyse package at the same level
                fsExtra.copySync(
                    path.join(basePath, constants.BASE_ANALYSE_PACKAGE),
                    path.join(projectPath, constants.ANALYSE)
                );
                conversionStep.addOperation(
                    new ConversionOperation(
                        commons_constants.ACTION_ADDED,
                        path.join(projectPath, constants.ANALYSE),
                        "Created `analyse` package"
                    )
                );
                logger.info(
                    `CreateBaseProjectStructure: Base analyse package created at ${projectPath}.`
                );
                analysePackagePomFile = path.join(
                    projectPath,
                    constants.ANALYSE,
                    constants.POM_XML
                );
                fs.copyFileSync(
                    path.join(basePath, constants.BASE_PARENT_POM),
                    path.join(projectPath, constants.POM_XML)
                );
                conversionStep.addOperation(
                    new ConversionOperation(
                        commons_constants.ACTION_ADDED,
                        path.join(projectPath, constants.POM_XML),
                        "Created base parent pom.xml"
                    )
                );
                logger.info(
                    `CreateBaseProjectStructure: Base parent pom.xml created at ${projectPath}`
                );
            }
            if (projects.length > 1) {
                fs.copyFileSync(
                    path.join(basePath, constants.BASE_PARENT_POM),
                    path.join(projectPath, constants.POM_XML)
                );
                conversionStep.addOperation(
                    new ConversionOperation(
                        commons_constants.ACTION_ADDED,
                        path.join(projectPath, constants.POM_XML),
                        "Created project's base reactor pom.xml"
                    )
                );
                logger.info(
                    `CreateBaseProjectStructure: Base reactor pom.xml created at ${projectPath}`
                );
            }
            fsExtra.copySync(
                path.join(basePath, constants.BASE_UI_APPS_PACKAGE),
                path.join(projectPath, constants.UI_APPS)
            );
            conversionStep.addOperation(
                new ConversionOperation(
                    commons_constants.ACTION_ADDED,
                    path.join(projectPath, constants.UI_APPS),
                    "Created package `ui.apps` for immutable code to be deployed to `/apps` or `/oak:index`"
                )
            );
            fsExtra.copySync(
                path.join(basePath, constants.BASE_UI_APPS_STRUCTURE_PACKAGE),
                path.join(projectPath, constants.UI_APPS_STRUCTURE)
            );
            conversionStep.addOperation(
                new ConversionOperation(
                    commons_constants.ACTION_ADDED,
                    path.join(projectPath, constants.UI_APPS_STRUCTURE),
                    "Created package `ui.apps.structure` to define the JCR repository roots in which the project’s code sub-packages deploy into"
                )
            );
            fsExtra.copySync(
                path.join(basePath, constants.BASE_UI_CONTENT_PACKAGE),
                path.join(projectPath, constants.UI_CONTENT)
            );
            conversionStep.addOperation(
                new ConversionOperation(
                    commons_constants.ACTION_ADDED,
                    path.join(projectPath, constants.UI_CONTENT),
                    "Created package `ui.content` for mutable content/configuration"
                )
            );
            fsExtra.copySync(
                path.join(basePath, constants.BASE_UI_CONFIG_PACKAGE),
                path.join(projectPath, constants.UI_CONFIG)
            );
            conversionStep.addOperation(
                new ConversionOperation(
                    commons_constants.ACTION_ADDED,
                    path.join(projectPath, constants.UI_CONFIG),
                    "Created package `ui.config` for OSGI configurations"
                )
            );
            // incase of single project, the parent pom file will be 1 directory level above
            // incase of multiple project, the parent pom file will be 2 directory level above
            await setPackageArtifactAndGroupId(
                projectPath,
                project.artifactId,
                project.appTitle,
                project.version,
                config,
                projects.length == 1
                    ? constants.RELATIVE_PATH_ONE_LEVEL_UP
                    : constants.RELATIVE_PATH_TWO_LEVEL_UP,
                conversionStep
            );
            // copy other packages from source
            copyOtherModules(project, conversionStep);
            // copy core bundles from source
            let allPackageDependencyList = [];
            let artifactIdInfoList = copyCoreBundles(project, conversionStep);
            artifactIdInfoList.forEach((artifactIdInfo) => {
                allPackageDependencyList.push(
                    constants.BUNDLE_DEPENDENCY_TEMPLATE.replace(
                        constants.DEFAULT_ARTIFACT_ID,
                        artifactIdInfo.artifactId
                    )
                        .replace(constants.DEFAULT_GROUP_ID, config.groupId)
                        .replace(
                            constants.DEFAULT_VERSION,
                            typeof artifactIdInfo.version === "undefined"
                                ? ""
                                : artifactIdInfo.version
                        )
                );
            });
            logger.info(
                `CreateBaseProjectStructure: Base packages created for ${projectPath}.`
            );
            //embed core bundles
            await pomManipulationUtil.embeddArtifactsUsingTemplate(
                allPackagePomFile,
                artifactIdInfoList,
                config.groupId,
                conversionStep
            );
            await pomManipulationUtil.addDependencies(
                allPackagePomFile,
                allPackageDependencyList,
                conversionStep
            );
            if (projects.length > 1) {
                // if there are multiple project, populate reactor pom for each project.
                await pomManipulationUtil.replaceVariables(
                    path.join(projectPath, constants.POM_XML),
                    {
                        [constants.DEFAULT_GROUP_ID]: config.groupId,
                        [constants.DEFAULT_ROOT_VERSION]:
                            config.parentPom.version,
                        [constants.DEFAULT_VERSION]:
                            project.version != null
                                ? project.version
                                : config.all.version,
                        [constants.DEFAULT_ARTIFACT_ID]:
                            project.artifactId != null
                                ? project.artifactId
                                : config.all.artifactId,
                        [constants.DEFAULT_APP_TITLE]:
                            project.appTitle != null
                                ? project.appTitle
                                : config.all.appTitle,
                        [constants.DEFAULT_ROOT_ARTIFACT_ID]:
                            config.parentPom.artifactId,
                        [constants.DEFAULT_RELATIVE_PATH]:
                            constants.RELATIVE_PATH_ONE_LEVEL_UP,
                    },
                    conversionStep
                );
            }
        }
        await pomManipulationUtil.replaceVariables(
            allPackagePomFile,
            {
                [constants.DEFAULT_GROUP_ID]: config.groupId,
                [constants.DEFAULT_ROOT_VERSION]: config.parentPom.version,
                [constants.DEFAULT_VERSION]: config.all.version,
                [constants.DEFAULT_ARTIFACT_ID]: config.all.artifactId,
                [constants.DEFAULT_APP_TITLE]: config.all.appTitle,
                [constants.DEFAULT_ROOT_ARTIFACT_ID]:
                    config.parentPom.artifactId,
            },
            conversionStep
        );
        await pomManipulationUtil.replaceVariables(
            analysePackagePomFile,
            {
                [constants.DEFAULT_GROUP_ID]: config.groupId,
                [constants.DEFAULT_ROOT_VERSION]: config.parentPom.version,
                [constants.DEFAULT_VERSION]: config.all.version,
                [constants.DEFAULT_ARTIFACT_ID]: config.all.artifactId,
                [constants.DEFAULT_APP_TITLE]: config.all.appTitle,
                [constants.DEFAULT_ROOT_ARTIFACT_ID]:
                    config.parentPom.artifactId,
            },
            conversionStep
        );
        conversionSteps.push(conversionStep);
    },
};

/**
 *
 * @param String projectPath  path of package
 * @param String artifactId  artifactId to set in package pom
 * @param String appTitle  appTitle to set in package pom
 * @param object config yaml object containing info of project to be restructured
 * @param String relativeParentPomPath  path of parent pom file
 * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
 *
 * Set artifactId and groupId in package pom
 */
async function setPackageArtifactAndGroupId(
    projectPath,
    artifactId,
    appTitle,
    version,
    config,
    relativeParentPomPath,
    conversionStep
) {
    let uiAppsReplacementObj = {
        [constants.DEFAULT_GROUP_ID]: config.groupId,
        [constants.DEFAULT_ARTIFACT_ID]: artifactId,
        [constants.DEFAULT_VERSION]: version,
        [constants.DEFAULT_APP_TITLE]: appTitle,
        [constants.DEFAULT_ROOT_ARTIFACT_ID]: config.parentPom.artifactId,
        [constants.DEFAULT_ROOT_VERSION]: config.parentPom.version,
        [constants.DEFAULT_RELATIVE_PATH]: relativeParentPomPath,
    };
    await pomManipulationUtil.replaceVariables(
        path.join(projectPath, constants.UI_APPS, constants.POM_XML),
        uiAppsReplacementObj,
        conversionStep
    );
    let uiAppsStructureReplacementObj = {
        [constants.DEFAULT_GROUP_ID]: config.groupId,
        [constants.DEFAULT_ARTIFACT_ID]: artifactId,
        [constants.DEFAULT_VERSION]: version,
        [constants.DEFAULT_APP_TITLE]: appTitle,
        [constants.DEFAULT_ROOT_ARTIFACT_ID]: config.parentPom.artifactId,
        [constants.DEFAULT_ROOT_VERSION]: config.parentPom.version,
        [constants.DEFAULT_RELATIVE_PATH]: relativeParentPomPath,
    };
    await pomManipulationUtil.replaceVariables(
        path.join(projectPath, constants.UI_APPS_STRUCTURE, constants.POM_XML),
        uiAppsStructureReplacementObj,
        conversionStep
    );
    let uiContentReplacementObj = {
        [constants.DEFAULT_GROUP_ID]: config.groupId,
        [constants.DEFAULT_ARTIFACT_ID]: artifactId,
        [constants.DEFAULT_VERSION]: version,
        [constants.DEFAULT_APP_TITLE]: appTitle,
        [constants.DEFAULT_ROOT_ARTIFACT_ID]: config.parentPom.artifactId,
        [constants.DEFAULT_ROOT_VERSION]: config.parentPom.version,
        [constants.DEFAULT_RELATIVE_PATH]: relativeParentPomPath,
    };
    await pomManipulationUtil.replaceVariables(
        path.join(projectPath, constants.UI_CONTENT, constants.POM_XML),
        uiContentReplacementObj,
        conversionStep
    );
    let uiConfigReplacementObj = {
        [constants.DEFAULT_GROUP_ID]: config.groupId,
        [constants.DEFAULT_ARTIFACT_ID]: artifactId,
        [constants.DEFAULT_VERSION]: version,
        [constants.DEFAULT_APP_TITLE]: appTitle,
        [constants.DEFAULT_ROOT_ARTIFACT_ID]: config.parentPom.artifactId,
        [constants.DEFAULT_ROOT_VERSION]: config.parentPom.version,
        [constants.DEFAULT_RELATIVE_PATH]: relativeParentPomPath,
    };
    await pomManipulationUtil.replaceVariables(
        path.join(projectPath, constants.UI_CONFIG, constants.POM_XML),
        uiConfigReplacementObj,
        conversionStep
    );
}

/**
 * @param String project project info object, from where modules need to be copied
 * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
 *
 * Copy all core bundles from source project to target project
 */
function copyCoreBundles(project, conversionStep) {
    // the path.join() is to standardize the paths to use '\' irrespective of OS
    let source = path.join(project.projectPath);
    let destination = path.join(
        commons_constants.TARGET_PROJECT_SRC_FOLDER,
        path.basename(project.projectPath)
    );
    let artifactIdInfoList = [];
    project.coreBundles.forEach((bundle) => {
        let sourceBundlePath = path.join(project.projectPath, bundle);
        let destinationBundlePath = path.join(
            destination,
            sourceBundlePath.replace(source, "")
        );
        artifactIdInfoList.push(
            copyModuleFromSource(
                sourceBundlePath,
                destinationBundlePath,
                project.appId,
                constants.BUNDLE,
                conversionStep
            )
        );
    });
    return artifactIdInfoList;
}

/**
 * @param String project project info object, from where modules need to be copied
 * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
 *
 * Copy all modules (expect bundles) from source project to target project
 */
function copyOtherModules(project, conversionStep) {
    let ignoredPaths = project.existingContentPackageFolder.map((folder) =>
        path.join(project.projectPath, folder)
    );
    // the path.join() is to standardize the paths to use '\' irrespective of OS
    let source = path.join(project.projectPath);
    let destination = path.join(
        commons_constants.TARGET_PROJECT_SRC_FOLDER,
        path.basename(project.projectPath)
    );
    // get all pom files
    let allPomFiles = util.globGetFilesByName(source, constants.POM_XML);
    let artifactIdInfoList = [];
    // check if packaging type is matching
    allPomFiles.forEach((pomFile) => {
        // the path.join() is to standardize the paths to use '\' irrespective of OS
        let srcFolderPath = path.join(path.dirname(pomFile));
        let destinationFolderPath = path.join(
            destination,
            srcFolderPath.replace(source, "")
        );
        // check if the folder has already been copied as part of some content package
        if (
            !fs.existsSync(destinationFolderPath) &&
            !ignoredPaths.includes(srcFolderPath) &&
            !srcFolderPath.includes("dispatcher") &&
            pomManipulationUtil.verifyArtifactPackagingType(
                pomFile,
                constants.CONTENT_PACKAGING_TYPES
            )
        ) {
            copyModuleFromSource(
                srcFolderPath,
                destinationFolderPath,
                project.appId,
                constants.CONTENT_PACKAGE,
                conversionStep
            );
        }
    });
    return artifactIdInfoList;
}

/**
 * Function to copy given source module to destination, and get the module info (artifactId, version).
 * NOTE : type expects `bundle` or `content-package`
 *
 * @returns the module info (artifactId, version).
 */
function copyModuleFromSource(
    srcFolderPath,
    destinationFolderPath,
    appId,
    type,
    conversionStep
) {
    let pomFile = path.join(srcFolderPath, constants.POM_XML);
    util.copyFolderSync(srcFolderPath, destinationFolderPath);
    logger.info(
        `CreateBaseProjectStructure: Copied ${type} from ${srcFolderPath} to ${destinationFolderPath}.`
    );
    conversionStep.addOperation(
        new ConversionOperation(
            commons_constants.ACTION_ADDED,
            destinationFolderPath,
            "Copied " +
                type +
                " from " +
                srcFolderPath +
                " to " +
                destinationFolderPath
        )
    );
    let pom = pomParser.parsePom({ filePath: pomFile });
    if (typeof pom.version === "undefined") {
        logger.warn(
            pomFile +
                " does not have version defined. Please add version in 'all' pom file."
        );
    }
    return {
        artifactId: pom.artifactId,
        appId: appId,
        version: pom.version,
    };
}

module.exports = CreateBaseProjectStructure;
