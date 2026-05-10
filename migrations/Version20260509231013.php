<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260509231013 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE user_pdfs (id INT AUTO_INCREMENT NOT NULL, file_name VARCHAR(255) NOT NULL, file_path VARCHAR(255) NOT NULL, mime_type VARCHAR(255) NOT NULL, size INT NOT NULL, created_at DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE application ADD pronouns VARCHAR(255) NOT NULL, ADD firstname VARCHAR(255) NOT NULL, ADD lastname VARCHAR(255) NOT NULL, ADD email VARCHAR(255) NOT NULL, ADD phone_number VARCHAR(255) NOT NULL, ADD street VARCHAR(255) NOT NULL, ADD house_number VARCHAR(255) NOT NULL, ADD city VARCHAR(255) NOT NULL, ADD user_id INT DEFAULT NULL, ADD documents_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE application ADD CONSTRAINT FK_A45BDDC1A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE application ADD CONSTRAINT FK_A45BDDC15F0F2752 FOREIGN KEY (documents_id) REFERENCES user_pdfs (id)');
        $this->addSql('CREATE INDEX IDX_A45BDDC1A76ED395 ON application (user_id)');
        $this->addSql('CREATE INDEX IDX_A45BDDC15F0F2752 ON application (documents_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE user_pdfs');
        $this->addSql('ALTER TABLE application DROP FOREIGN KEY FK_A45BDDC1A76ED395');
        $this->addSql('ALTER TABLE application DROP FOREIGN KEY FK_A45BDDC15F0F2752');
        $this->addSql('DROP INDEX IDX_A45BDDC1A76ED395 ON application');
        $this->addSql('DROP INDEX IDX_A45BDDC15F0F2752 ON application');
        $this->addSql('ALTER TABLE application DROP pronouns, DROP firstname, DROP lastname, DROP email, DROP phone_number, DROP street, DROP house_number, DROP city, DROP user_id, DROP documents_id');
    }
}
