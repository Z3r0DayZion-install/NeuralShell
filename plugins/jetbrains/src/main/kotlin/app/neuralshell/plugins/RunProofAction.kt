package app.neuralshell.plugins

import com.intellij.notification.NotificationGroupManager
import com.intellij.notification.NotificationType
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.project.Project
import java.io.File

class RunProofAction : AnAction() {
    override fun actionPerformed(event: AnActionEvent) {
        val project = event.project ?: return
        val basePath = project.basePath ?: return
        val process = ProcessBuilder("npm", "run", "proof:bundle")
            .directory(File(basePath))
            .redirectErrorStream(true)
            .start()
        val output = process.inputStream.bufferedReader().readText()
        val exitCode = process.waitFor()

        val summary = if (exitCode == 0) "✅ proof:bundle passed" else "❌ proof:bundle failed ($exitCode)"
        ProofToolWindowFactory.updateContent(project, "$summary\n$output")
        NotificationGroupManager.getInstance()
            .getNotificationGroup("NeuralShell")
            .createNotification(summary, NotificationType.INFORMATION)
            .notify(project)
    }
}

