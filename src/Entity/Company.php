<?php

namespace App\Entity;

use App\Repository\CompanyRepository;
use DateTimeImmutable;
use DateTimeZone;
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
    private string $CompanyName;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Sector cannot be empty.')]
    private string $CompanySector;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Job cannot be empty.')]
    private string $JobName;

    #[ORM\Column(type: "guid", unique: true)]
    private string $applicationId;

    #[ORM\Column]
    private \DateTimeImmutable $created_at;

    #[ORM\ManyToOne(inversedBy: 'companies')]
    private ?User $user = null;

    #[ORM\Column(type: "text", nullable: true)]
    private ?string $markdown = null;

    #[ORM\Column(length: 255)]
    private string $street;

    #[ORM\Column(length: 255)]
    private string $houseNumber;

    #[ORM\Column(length: 255)]
    private string $city;

    #[ORM\Column(length: 255)]
    private string $postalCode;

    #[ORM\Column(length: 255)]
    private string $titel;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $lat = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $lng = null;

    public function __construct()
    {
        $this->applicationId = Uuid::v4()->toRfc4122();
        $this->created_at = new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin'));
    }

    public function getId(): ?int { return $this->id; }

    public function getCompanyName(): string { return $this->CompanyName; }
    public function setCompanyName(string $CompanyName): static { $this->CompanyName = $CompanyName; return $this; }

    public function getCompanySector(): string { return $this->CompanySector; }
    public function setCompanySector(string $CompanySector): static { $this->CompanySector = $CompanySector; return $this; }

    public function getJobName(): string { return $this->JobName; }
    public function setJobName(string $JobName): static { $this->JobName = $JobName; return $this; }

    public function getApplicationId(): string { return $this->applicationId; }
    public function setApplicationId(string $applicationId): static { $this->applicationId = $applicationId; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }
    public function setCreatedAt(\DateTimeImmutable $created_at): static { $this->created_at = $created_at; return $this; }

    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): static { $this->user = $user; return $this; }

    public function getMarkdown(): ?string { return $this->markdown; }
    public function setMarkdown(string $markdown): static { $this->markdown = $markdown; return $this; }

    public function getStreet(): string { return $this->street; }
    public function setStreet(string $street): static { $this->street = $street; return $this; }

    public function getHouseNumber(): string { return $this->houseNumber; }
    public function setHouseNumber(string $houseNumber): static { $this->houseNumber = $houseNumber; return $this; }

    public function getCity(): string { return $this->city; }
    public function setCity(string $city): static { $this->city = $city; return $this; }

    public function getPostalCode(): string { return $this->postalCode; }
    public function setPostalCode(string $postalCode): static { $this->postalCode = $postalCode; return $this; }

    public function getTitel(): string { return $this->titel; }
    public function setTitel(string $titel): static { $this->titel = $titel; return $this; }

    public function getLat(): ?string { return $this->lat; }
    public function setLat(?string $lat): static { $this->lat = $lat; return $this; }

    public function getLng(): ?string { return $this->lng; }
    public function setLng(?string $lng): static { $this->lng = $lng; return $this; }
}