<?php

namespace App\Enum;

enum Salutation: string
{
    case MR = 'Herr';
    case MRS = 'Frau';
    case DIVERS = 'Divers';
}