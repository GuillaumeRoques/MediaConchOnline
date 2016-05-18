<?php

namespace AppBundle\Lib\Checker;

use AppBundle\Lib\MediaConch\MediaConchServer;

class CheckerValidate
{
    protected $id;
    protected $response;

    public function __construct(MediaConchServer $mc)
    {
        $this->mc = $mc;
    }

    public function validate($id, $report, $policy = null)
    {
        $this->id = $id;
        $this->response = $this->mc->validate($id, $this->getReportType($report), $policy);
    }

    public function getResponseAsArray()
    {
        return array('valid' => $this->response->getValid(),
            'error' => $this->response->getError(),
            'id' => $this->id,
            );
    }

    protected function getReportType($report)
    {
        switch ($report) {
            case '5':
                return 'VERAPDF';
                break;
            case '6':
                return 'DPFMANAGER';
                break;
            case '1':
                return 'POLICY';
                break;
            case '2':
            default:
                return 'IMPLEMENTATION';
        }
    }
}
