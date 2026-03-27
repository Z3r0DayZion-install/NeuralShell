plugins {
    id("org.jetbrains.intellij") version "1.17.4"
    kotlin("jvm") version "1.9.24"
}

group = "app.neuralshell"
version = "0.1.0"

repositories {
    mavenCentral()
}

intellij {
    version.set("2024.2")
    type.set("IC")
    plugins.set(listOf("com.intellij.java"))
}

tasks {
    patchPluginXml {
        sinceBuild.set("242")
        untilBuild.set("252.*")
    }
}

kotlin {
    jvmToolchain(17)
}

