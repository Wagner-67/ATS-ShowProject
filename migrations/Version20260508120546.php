<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260508120546 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE company ADD markdown VARCHAR(255) NOT NULL, CHANGE application_id application_id CHAR(36) NOT NULL');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_4FBF094F3E030ACD ON company (application_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP INDEX UNIQ_4FBF094F3E030ACD ON company');
        $this->addSql('ALTER TABLE company DROP markdown, CHANGE application_id application_id VARCHAR(255) NOT NULL');
    }
}
