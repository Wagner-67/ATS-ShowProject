<?php

namespace App\Enum;

enum StatusType: string
{
    case PENDING = 'pending';
    case REVIEW =  'review';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
}