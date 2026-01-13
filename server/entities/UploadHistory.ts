import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

@Entity('upload_history')
@Index('idx_upload_time', ['uploadTime'])
@Index('idx_file_name', ['fileName'])
@Index('idx_remote_path', ['remotePath'])
export class UploadHistory {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName: string

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: string

  @Column({ name: 'file_type', type: 'varchar', length: 50, nullable: true })
  fileType: string | null

  @Column({ name: 'remote_path', type: 'varchar', length: 500 })
  remotePath: string

  @Column({ name: 'ip_address', type: 'varchar', length: 50, nullable: true })
  ipAddress: string | null

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent: string | null

  @Column({ name: 'upload_time', type: 'datetime' })
  uploadTime: Date

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date
}
