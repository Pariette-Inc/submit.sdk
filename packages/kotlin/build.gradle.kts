plugins {
    kotlin("jvm") version "2.0.21"
    kotlin("plugin.serialization") version "2.0.21"
    `maven-publish`
    signing
}

group = "com.submitcms"
version = System.getenv("SDK_VERSION") ?: "1.0.0"

repositories { mavenCentral() }

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    testImplementation(kotlin("test"))
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
    testImplementation("com.squareup.okhttp3:mockwebserver:4.12.0")
}

kotlin { jvmToolchain(17) }

tasks.test { useJUnitPlatform() }

java {
    withSourcesJar()
    withJavadocJar()
}

publishing {
    publications {
        create<MavenPublication>("maven") {
            from(components["java"])
            artifactId = "sdk"

            pom {
                name = "SubmitCMS SDK"
                description = "SubmitCMS resmî Kotlin/Android SDK'sı"
                url = "https://submitcms.com/sdk"
                licenses {
                    license {
                        name = "MIT"
                        url = "https://opensource.org/licenses/MIT"
                    }
                }
                scm { url = "https://github.com/Pariette-Inc/submit.sdk" }
            }
        }
    }
}

// Maven Central imzalama gerektirir. Anahtarlar ortam değişkeninden gelir;
// yerel derlemede imzalama atlanır.
signing {
    val key = System.getenv("SIGNING_KEY")
    val password = System.getenv("SIGNING_PASSWORD")
    if (key != null && password != null) {
        useInMemoryPgpKeys(key, password)
        sign(publishing.publications["maven"])
    }
}
