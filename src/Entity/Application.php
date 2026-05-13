<?php

namespace App\Entity;

use App\Enum\Salutation;
use App\Enum\StatusType;
use App\Repository\ApplicationRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ApplicationRepository::class)]
class Application
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'applications')]
    private ?User $user = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $applicationId = null;

    #[ORM\OneToMany(mappedBy: 'application', targetEntity: UserPdfs::class)]
    private Collection $documents;

    #[ORM\Column(type: 'string', length: 20, enumType: Salutation::class)]
    private ?Salutation $salutation = null;

    #[ORM\Column(length: 255)]
    private ?string $firstname = null;

    #[ORM\Column(length: 255)]
    private ?string $lastname = null;

    #[ORM\Column(length: 255)]
    private ?string $email = null;

    #[ORM\Column(length: 255)]
    private ?string $phoneNumber = null;

    #[ORM\Column(length: 255)]
    private ?string $street = null;

    #[ORM\Column(length: 255)]
    private ?string $houseNumber = null;

    #[ORM\Column(length: 255)]
    private ?string $city = null;

    #[ORM\Column(type: 'string', length: 20, enumType: StatusType::class)]
    private ?StatusType $status = StatusType::PENDING;

    public function __construct()
    {
        $this->documents = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): static { $this->user = $user; return $this; }

    public function getApplicationId(): ?string { return $this->applicationId; }
    public function setApplicationId(?string $applicationId): static { $this->applicationId = $applicationId; return $this; }

    public function getDocuments(): Collection { return $this->documents; }

    public function getSalutation(): ?Salutation { return $this->salutation; }
    public function setSalutation(Salutation|string|null $salutation): static
    {
        if (is_string($salutation)) {
            $salutation = Salutation::tryFrom($salutation);
        }
        $this->salutation = $salutation;
        return $this;
    }

    public function getFirstname(): ?string { return $this->firstname; }
    public function setFirstname(string $firstname): static { $this->firstname = $firstname; return $this; }

    public function getLastname(): ?string { return $this->lastname; }
    public function setLastname(string $lastname): static { $this->lastname = $lastname; return $this; }

    public function getEmail(): ?string { return $this->email; }
    public function setEmail(string $email): static { $this->email = $email; return $this; }

    public function getPhoneNumber(): ?string { return $this->phoneNumber; }
    public function setPhoneNumber(string $phoneNumber): static { $this->phoneNumber = $phoneNumber; return $this; }

    public function getStreet(): ?string { return $this->street; }
    public function setStreet(string $street): static { $this->street = $street; return $this; }

    public function getHouseNumber(): ?string { return $this->houseNumber; }
    public function setHouseNumber(string $houseNumber): static { $this->houseNumber = $houseNumber; return $this; }

    public function getCity(): ?string { return $this->city; }
    public function setCity(string $city): static { $this->city = $city; return $this; }

    public function getStatus(): ?StatusType { return $this->status; }
    public function setStatus(StatusType|string|null $status): static
    {        if (is_string($status)) {
            $status = StatusType::tryFrom($status);
        }
        $this->status = $status;
        return $this;
    }

    public function addDocument(UserPdfs $document): static
    {
        if (!$this->documents->contains($document)) {
            $this->documents->add($document);
            $document->setApplication($this);
        }

        return $this;
    }

    public function removeDocument(UserPdfs $document): static
    {
        if ($this->documents->removeElement($document)) {
            // set the owning side to null (unless already changed)
            if ($document->getApplication() === $this) {
                $document->setApplication(null);
            }
        }

        return $this;
    }
}