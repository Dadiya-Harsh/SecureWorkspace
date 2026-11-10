package com.secureworkspace.spike

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.chaquo.python.Python
import com.chaquo.python.android.AndroidPlatform

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val tvResults = findViewById<TextView>(R.id.tvResults)
        val btnRun = findViewById<Button>(R.id.btnRun)

        fun executeTests() {
            tvResults.text = "Initializing Python & running crypto tests...\n"
            try {
                if (!Python.isStarted()) {
                    Python.start(AndroidPlatform(this))
                }
                val py = Python.getInstance()
                val module = py.getModule("crypto_verifier")
                val result = module.callAttr("run_verification").toString()
                tvResults.text = result
            } catch (e: Exception) {
                tvResults.text = "Error executing tests:\n${e.message}\n${e.stackTraceToString()}"
            }
        }

        btnRun.setOnClickListener {
            executeTests()
        }

        // Auto-run on startup
        executeTests()
    }
}
