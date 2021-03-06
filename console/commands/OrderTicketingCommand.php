<?php
class OrderTicketingCommand extends CConsoleCommand
{

    public function getHelp()
    {
        return <<<EOD
orderticketing cron --orderId=FOO
EOD;
    }

    public function actionCron($orderId = 0)
    {
        //! FIXME cache order instance
        $orderId = intval($orderId);
        if ($orderId) {
            Yii::app()->user->setState('orderBookingId', $orderId);
            $order = Yii::app()->order;
            $order->initByOrderBookingId($orderId);
            $payments = Yii::app()->payments;
            $bookers = $payments->preProcessBookers($order->getBookers());
            if(!count($bookers))
                throw new Exception("Something went wrong with order #" . $orderId);

            foreach($bookers as $booker)
            {
                $payments->notifyNemo($booker);
                echo $payments->getStatus($booker) . "=>\n";
                $booker->status('ticketing');
                echo $payments->getStatus($booker) . "\n";
                echo "--------------------------------\n";
                //! Remove scheduled change to BookingTimilimit state
            }
            if($this->isDone($orderId)) {
                $this->sendNotifications($orderId);
                $this->confirmPayment($orderId);
            }
        }
        else
        {
            echo $this->getHelp();
        }
    }

    /**
       Sends order email/sms/whatever
    */
    private function sendNotifications($orderId) {
        $order = Yii::app()->order;
        $order->initByOrderBookingId($orderId);
        $order->sendNotifications();
    }







    /**
     *  Confirms preauthorized transactions
    */
    private function confirmPayment($orderId) {
        $order = Yii::app()->order;
        $order->initByOrderBookingId($orderId);
        $payments = Yii::app()->payments;
        $bookers = $payments->preProcessBookers($order->getBookers());
        foreach($bookers as $booker)
        {
            $bill = $payments->getBillForBooker($booker);
            if (!$bill->getChannel()->confirm()) {
                //! fixme log exceptions
                echo "Confirm failed for bill #" . $bill->id . " transaction #" . $bill->transactionId . "\n";
            }
        }
    }

    private function isDone($orderId) {
        $order = Yii::app()->order;
        $order->initByOrderBookingId($orderId);
        $payments = Yii::app()->payments;
        $bookers = $payments->preProcessBookers($order->getBookers());
        foreach($bookers as $booker)
        {
            if($payments->getStatus($booker)!=="done")
                return false;
        }
        return true;
    }

}
