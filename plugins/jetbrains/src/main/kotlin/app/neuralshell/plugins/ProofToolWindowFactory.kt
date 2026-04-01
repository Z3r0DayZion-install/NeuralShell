package app.neuralshell.plugins

import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.ui.content.ContentFactory
import javax.swing.JTextArea
import javax.swing.JScrollPane

class ProofToolWindowFactory : ToolWindowFactory {
    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        val area = JTextArea().apply {
            isEditable = false
            text = "NeuralShell proof status will appear here."
        }
        val content = ContentFactory.getInstance().createContent(JScrollPane(area), "", false)
        toolWindow.contentManager.addContent(content)
        project.putUserData(TEXT_AREA_KEY, area)
    }

    companion object {
        private val TEXT_AREA_KEY = com.intellij.openapi.util.Key.create<JTextArea>("neuralshell.proof.text")

        fun updateContent(project: Project, text: String) {
            project.getUserData(TEXT_AREA_KEY)?.text = text
        }
    }
}

