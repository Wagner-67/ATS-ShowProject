<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260510115954 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE application DROP FOREIGN KEY `FK_A45BDDC15F0F2752`');
        $this->addSql('DROP INDEX IDX_A45BDDC15F0F2752 ON application');
        $this->addSql('ALTER TABLE application DROP documents_id');
        $this->addSql('ALTER TABLE user_pdfs ADD application_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE user_pdfs ADD CONSTRAINT FK_858FBC123E030ACD FOREIGN KEY (application_id) REFERENCES application (id)');
        $this->addSql('CREATE INDEX IDX_858FBC123E030ACD ON user_pdfs (application_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE application ADD documents_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE application ADD CONSTRAINT `FK_A45BDDC15F0F2752` FOREIGN KEY (documents_id) REFERENCES user_pdfs (id)');
        $this->addSql('CREATE INDEX IDX_A45BDDC15F0F2752 ON application (documents_id)');
        $this->addSql('ALTER TABLE user_pdfs DROP FOREIGN KEY FK_858FBC123E030ACD');
        $this->addSql('DROP INDEX IDX_858FBC123E030ACD ON user_pdfs');
        $this->addSql('ALTER TABLE user_pdfs DROP application_id');
    }
}
