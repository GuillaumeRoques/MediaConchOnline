<?php

namespace AppBundle\Lib\MediaConch;

use Symfony\Component\Process\ProcessBuilder;

class MediaConchTrackTypeFields extends MediaConch
{
    public function __construct()
    {
    }

    public function run($trackType)
    {
        $builder = new ProcessBuilder();
        $process = $builder->setPrefix($this->MediaConch)
            ->add('--MAXML_Fields=' . $trackType)
            ->getProcess();

        $process->run();

        if ($process->isSuccessful()) {
            $this->success = true;
            $this->output = trim($process->getOutput());
        }

        $this->output = trim($process->getOutput());

        return $this;
    }
}
