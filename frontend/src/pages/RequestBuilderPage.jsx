import React from 'react';
import { useLocation } from 'react-router-dom';
import { RequestBuilder } from '../components/request/RequestBuilder';

export function RequestBuilderPage() {
  const location = useLocation();
  const initialTestCase = location.state?.testCase || null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <RequestBuilder initialTestCase={initialTestCase} />
    </div>
  );
}
