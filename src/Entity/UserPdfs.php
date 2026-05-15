<?php

namespace App\Entity;

use App\Repository\UserPdfsRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UserPdfsRepository::class)]
class UserPdfs
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $fileName;

    #[ORM\Column(length: 255)]
    private string $filePath;

    #[ORM\Column(length: 255)]
    private string $mimeType;

    #[ORM\Column]
    private int $size;

    #[ORM\Column]
    private \DateTimeImmutable $created_at;

    #[ORM\ManyToOne(inversedBy: 'documents')]
    private ?Application $application = null;

    public function getId(): ?int { return $this->id; }

    public function getFileName(): string { return $this->fileName; }
    public function setFileName(string $fileName): static { $this->fileName = $fileName; return $this; }

    public function getFilePath(): string { return $this->filePath; }
    public function setFilePath(string $filePath): static { $this->filePath = $filePath; return $this; }

    public function getMimeType(): string { return $this->mimeType; }
    public function setMimeType(string $mimeType): static { $this->mimeType = $mimeType; return $this; }

    public function getSize(): int { return $this->size; }
    public function setSize(int $size): static { $this->size = $size; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }
    public function setCreatedAt(\DateTimeImmutable $created_at): static { $this->created_at = $created_at; return $this; }

    public function getApplication(): ?Application { return $this->application; }
    public function setApplication(?Application $application): static { $this->application = $application; return $this; }
}