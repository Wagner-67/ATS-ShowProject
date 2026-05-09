<?php

namespace App\Enum;

enum ApplicationType: string
{
    case Internship = 'internship';
    case Apprenticeship = 'apprenticeship';
    case Contract = 'contract';
}