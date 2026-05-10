<?php

namespace App\Entity;

use App\Repository\CompanyRepository;
use DateTimeImmutable;
use DateTimeZone;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: CompanyRepository::class)]
class Company
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Name cannot be empty.')]
    private ?string $CompanyName = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Sector cannot be empty.')]
    private ?string $CompanySector = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Location cannot be empty.')]
    private ?string $CompanyLocation = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Job cannot be empty.')]
    private ?string $JobName = null;

    #[ORM\Column(type: "guid", unique: true)]
    private ?string $applicationId = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

   #[ORM\ManyToOne(inversedBy: 'companies')]
    private ?User $user = null;

    #[ORM\Column(type: "text", nullable: true)] 
    private ?string $markdown = null;

    public function __construct()
    {
        $this->applicationId = Uuid::v4()->toRfc4122();
        $this->created_at = new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin'));
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCompanyName(): ?string
    {
        return $this->CompanyName;
    }

    public function setCompanyName(string $CompanyName): static
    {
        $this->CompanyName = $CompanyName;

        return $this;
    }

    public function getCompanySector(): ?string
    {
        return $this->CompanySector;
    }

    public function setCompanySector(string $CompanySector): static
    {
        $this->CompanySector = $CompanySector;

        return $this;
    }

    public function getCompanyLocation(): ?string
    {
        return $this->CompanyLocation;
    }

    public function setCompanyLocation(string $CompanyLocation): static
    {
        $this->CompanyLocation = $CompanyLocation;

        return $this;
    }

    public function getJobName(): ?string
    {
        return $this->JobName;
    }

    public function setJobName(string $JobName): static
    {
        $this->JobName = $JobName;

        return $this;
    }

    public function getApplicationId(): ?string
    {
        return $this->applicationId;
    }

    public function setApplicationId(string $applicationId): static
    {
        $this->applicationId = $applicationId;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->created_at;
    }

    public function setCreatedAt(\DateTimeImmutable $created_at): static
    {
        $this->created_at = $created_at;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getMarkdown(): ?string
    {
        return $this->markdown;
    }

    public function setMarkdown(string $markdown): static
    {
        $this->markdown = $markdown;

        return $this;
    }
}
