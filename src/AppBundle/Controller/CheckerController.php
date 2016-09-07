<?php

namespace AppBundle\Controller;

use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Method;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\File\File;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;
use Symfony\Component\Finder\Finder;

use AppBundle\Controller\BaseController;
use AppBundle\Entity\XslPolicyFile;

/**
 * @Route("/")
 */
class CheckerController extends BaseController
{
    /**
     * @Route("/checker")
     * @Template()
     */
    public function checkerAction(Request $request)
    {
        if ($this->get('mediaconch_user.quotas')->hasUploadsRights()) {
            $formUpload = $this->createForm('checkerUpload');
        }

        if ($this->get('mediaconch_user.quotas')->hasUrlsRights()) {
            $formOnline = $this->createForm('checkerOnline');
        }

        if (null != $this->container->getParameter('mco_check_folder') && file_exists($this->container->getParameter('mco_check_folder'))) {
            $repositoryEnable = true;
            if ($this->get('mediaconch_user.quotas')->hasPolicyChecksRights()) {
                $formRepository = $this->createForm('checkerRepository');
            }
        }
        else {
            $repositoryEnable = false;
        }

        return array('formUpload' => isset($formUpload) ? $formUpload->createView() : false,
            'formOnline' => isset($formOnline) ? $formOnline->createView() : false,
            'formRepository' => isset($formRepository) ? $formRepository->createView() : false,
            'repositoryEnable' => $repositoryEnable);
    }

    /**
     * @Route("/checkerStatus/")
     */
    public function checkerStatusAction(Request $request)
    {
        if (!$request->isXmlHttpRequest()) {
            throw new NotFoundHttpException();
        }

        // Get the list of IDs
        $ids = $request->request->get('ids');

        if (is_array($ids) && count($ids) > 0) {
            $status = $this->get('mco.checker.status');
            $status->getStatus($ids);
            return new JsonResponse(array('status' => $status->getResponse()->getResponse()));
        }
        else {
            return new JsonResponse(array('message' => 'Error'), 400);
        }
    }


    /**
     * @Route("/checkerReportStatus/{id}/{reportType}", requirements={"id": "\d+", "reportType"})
     */
    public function checkerReportStatusAction($id, $reportType, Request $request)
    {
        if (!$request->isXmlHttpRequest()) {
            throw new NotFoundHttpException();
        }

        $validate = $this->get('mco.checker.validate');
        $validate->validate($id, $reportType);

        return new JsonResponse($validate->getResponseAsArray());
    }

    /**
     * @Route("/checkerPolicyStatus/{id}", requirements={"id": "\d+"})
     */
    public function checkerPolicyStatusAction($id, Request $request)
    {
        if (!$request->isXmlHttpRequest()) {
            throw new NotFoundHttpException();
        }

        $validate = $this->get('mco.checker.validate');
        $validate->validate($id, 1, $request->query->get('policy'));

        return new JsonResponse($validate->getResponseAsArray());
    }

    /**
     * @Route("/checkerReportAndPolicyStatus/{id}/{reportType}/{policyId}", requirements={"id": "\d+", "reportType", "policyId": "\d+"})
     */
    public function checkerReportAndPolicyStatusAction($id, $reportType, $policyId, Request $request)
    {
        if (!$request->isXmlHttpRequest()) {
            throw new NotFoundHttpException();
        }

        // Implementation report
        $validate = $this->get('mco.checker.validate');
        $validate->validate($id, $reportType);
        $implemReport = $validate->getResponseAsArray();

        $validate->validate($id, 1, $policyId);
        $statusReport = $validate->getResponseAsArray();

        return new JsonResponse(array('implemReport' => $implemReport, 'statusReport' => $statusReport));
    }


    /**
     * @Route("/checkerReport/{id}/{reportType}/{displayName}", requirements={"id": "\d+", "reportType", "displayName"})
     */
    public function checkerReportAction($id, $reportType, $displayName, Request $request)
    {
        if (!$request->isXmlHttpRequest()) {
            throw new NotFoundHttpException();
        }

        $displayFile = null;
        if (ctype_digit($request->query->get('display'))) {
            $display = $this->getDoctrine()
                ->getRepository('AppBundle:DisplayFile')
                ->findOneByUserOrSystem($request->query->get('display'), $this->getUser());
            if ($display) {
                $helper = $this->container->get('vich_uploader.storage');
                $displayFile = $helper->resolvePath($display, 'displayFile');
            }
        }

        $file = $this->get('mco.checker.filename');
        $file->fileFromId($id);

        if ($file->getResponse()->getStatus()) {
            $report = $this->get('mco.checker.report');
            $report->report($id, $reportType, $displayName, $displayFile, $request->query->get('policy'), $request->query->get('verbosity'));

            if ($report->getResponse()->getStatus()) {
                $report->setFullPath(false, $file->getFilename(true));

                if (($reportType == 'mi' || $reportType == 'mt') && $displayName == 'jstree') {
                    return new Response($report->getReport());
                }
                else {
                    return new JsonResponse($report->getResponseAsArray());
                }
            }
        }

        return new JsonResponse(array('message' => 'Error'), 400);
    }

    /**
     * @Route("/checkerCreatePolicy/{id}", requirements={"id": "\d+"})
     */
    public function checkerCreatePolicyAction($id, Request $request)
    {
        if (!$request->isXmlHttpRequest()) {
            throw new NotFoundHttpException();
        }

        $policyFromFile = $this->get('mco.policy.fromFile');
        $policyFromFile->getPolicy($id);

        if (null !== $policyFromFile->getCreatedId()) {
            $policySave = $this->get('mco.policy.save');
            $policySave->save($policyFromFile->getCreatedId());
            $policy = $this->get('mco.policy.getPolicy');
            $policy->getPolicy($policyFromFile->getCreatedId());
            $policy->getResponse()->getPolicy();
            $policy = $policy->getResponse()->getPolicy();

            return new JsonResponse(array('result' => true, 'policyId' => $policy->id, 'policyName' => $policy->name));
        }

        return new JsonResponse(array('result' => false));
    }

    /**
     * @Route("/checkerDownloadReport/{id}/{reportType}/{displayName}", requirements={"id": "\d+", "reportType", "displayName"})
     */
    public function checkerDownloadReportAction($id, $reportType, $displayName, Request $request)
    {
        if ($this->container->has('profiler'))
        {
            $this->container->get('profiler')->disable();
        }

        $displayFile = null;
        if (ctype_digit($request->query->get('display'))) {
            $display = $this->getDoctrine()
            ->getRepository('AppBundle:DisplayFile')
            ->findOneByUserOrSystem($request->query->get('display'), $this->getUser());
            if ($display) {
                $helper = $this->container->get('vich_uploader.storage');
                $displayFile = $helper->resolvePath($display, 'displayFile');
            }
        }

        $file = $this->get('mco.checker.filename');
        $file->fileFromId($id);
        if ($file->getResponse()->getStatus()) {

            $report = $this->get('mco.checker.report');
            $report->report($id, $reportType, $displayName, $displayFile, $request->query->get('policy'), $request->query->get('verbosity'));

            if ($report->getResponse()->getStatus()) {
                $report->setFullPath(false, $file->getFilename(true));
                $response = new Response($report->getReport());
                $disposition = $this->downloadFileDisposition($response, $file->getFilename() . '_' . $report->getDownloadReportName() . '.' . $report->getDownloadReportExtension());

                $response->headers->set('Content-Type', $report->getDownloadReportMimeType());
                $response->headers->set('Content-Disposition', $disposition);
                $response->headers->set('Content-length', strlen($report->getReport()));

                return $response;
            }
        }

        throw new ServiceUnavailableHttpException();
    }

    /**
     * @Route("/checkerAjaxForm")
     */
    public function checkerAjaxFormAction(Request $request)
    {
        if (!$request->isXmlHttpRequest()) {
            throw new NotFoundHttpException();
        }

        $formUpload = $this->createForm('checkerUpload');
        $formUpload->handleRequest($request);
        if ($formUpload->isSubmitted()) {
            if ($this->get('mediaconch_user.quotas')->hasUploadsRights()) {
                if ($formUpload->isValid()) {
                    $data = $formUpload->getData();

                    $settings = $this->get('mco.settings');
                    $settings->setLastUsedPolicy($data['policy']);
                    $settings->setLastUsedDisplay($data['display']);
                    $settings->setLastUsedVerbosity($data['verbosity']);

                    if ($data['file']->isValid()) {
                        $path = $this->container->getParameter('kernel.root_dir').'/../files/upload/' . $this->getUser()->getId();
                        $filename =  $data['file']->getClientOriginalName();
                        $fileMd5 = md5(file_get_contents($data['file']->getRealPath()));

                        if (file_exists($path . '/' . $fileMd5 . '/' . $filename)) {
                            $file = new File($path . '/' . $fileMd5 . '/' . $filename);
                        }
                        else {
                            $file = $data['file']->move($path . '/' . $fileMd5, $filename);
                        }

                        $checks = $this->get('mco.checker.analyze');
                        $checks->analyse($file->getRealPath());
                        $response = $checks->getResponseAsArray();

                        $this->get('mediaconch_user.quotas')->hitUploads();

                        return new JsonResponse($response, 200);
                    }
                }
            }
            else {
                return new JsonResponse(array('message' => 'Quota exceeded', 'quota' => $this->renderView('AppBundle:Default:quotaExceeded.html.twig')), 400);
            }

            return new JsonResponse(array('message' => 'Error'), 400);
        }

        $formOnline = $this->createForm('checkerOnline');
        $formOnline->handleRequest($request);

        if ($formOnline->isSubmitted()) {
            if ($this->get('mediaconch_user.quotas')->hasUrlsRights()) {
                if ($formOnline->isValid()) {
                    $data = $formOnline->getData();

                    $settings = $this->get('mco.settings');
                    $settings->setLastUsedPolicy($data['policy']);
                    $settings->setLastUsedDisplay($data['display']);
                    $settings->setLastUsedVerbosity($data['verbosity']);

                    $checks = $this->get('mco.checker.analyze');
                    $checks->setFullPath(true);
                    $checks->analyse(str_replace(' ', '%20', $data['file']));
                    $response = $checks->getResponseAsArray();

                    $this->get('mediaconch_user.quotas')->hitUrls();

                    return new JsonResponse($response, 200);
                }
            }
            else {
                return new JsonResponse(array('message' => 'Quota exceeded', 'quota' => $this->renderView('AppBundle:Default:quotaExceeded.html.twig')), 400);
            }

            return new JsonResponse(array('message' => 'Error'), 400);
        }

        if (null != $this->container->getParameter('mco_check_folder') && file_exists($this->container->getParameter('mco_check_folder'))) {
            $formRepository = $this->createForm('checkerRepository');
            $formRepository->handleRequest($request);

            if ($formRepository->isSubmitted()) {
                if ($this->get('mediaconch_user.quotas')->hasPolicyChecksRights()) {
                    if ($formRepository->isValid()) {
                        $data = $formRepository->getData();
                        $response = array();

                        $settings = $this->get('mco.settings');
                        $settings->setLastUsedPolicy($data['policy']);
                        $settings->setLastUsedDisplay($data['display']);
                        $settings->setLastUsedVerbosity($data['verbosity']);

                        $finder = new Finder();
                        $finder->files()->in($this->container->getParameter('mco_check_folder'));
                        foreach($finder as $file) {
                            $checks = $this->get('mco.checker.analyze');
                            $checks->analyse($file->getPathname());
                            $response[] = $checks->getResponseAsArray();
                        }

                        $this->get('mediaconch_user.quotas')->hitPolicyChecks(count($finder));

                        return new JsonResponse($response, 200);
                    }
                }
                else {
                    return new JsonResponse(array('message' => 'Quota exceeded', 'quota' => $this->renderView('AppBundle:Default:quotaExceeded.html.twig')), 400);
                }

                return new JsonResponse(array('message' => 'Error'), 400);
            }
        }

        return new JsonResponse(array('message' => 'No form selected'), 400);
    }
}
