import { Client } from 'ssh2'

export const executeSshCommand = (command) => {
    return new Promise((resolve, reject) => {
        const config = useRuntimeConfig()
        const conn = new Client()

        conn.on('ready', () => {
            conn.exec(command, (err, stream) => {
                if (err) {
                    conn.end()
                    return reject(err)
                }

                let stdout = ''
                let stderr = ''

                stream.on('close', (code, signal) => {
                    conn.end()
                    if (code === 0) {
                        resolve(stdout)
                    } else {
                        console.error(`SSH command failed with code ${code}. Stderr: ${stderr}`)
                        reject(new Error(stderr || `Command failed with code ${code}`))
                    }
                }).on('data', (data) => {
                    stdout += data
                }).stderr.on('data', (data) => {
                    stderr += data
                })
            })
        }).on('error', (err) => {
            console.error('SSH connection error:', err)
            reject(err)
        }).connect({
            host: config.ssh.host,
            port: config.ssh.port,
            username: config.ssh.user,
            password: config.ssh.password
        })
    })
}
