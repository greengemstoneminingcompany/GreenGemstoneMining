// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SomalilandMap from '@/components/SomalilandMap';
import ResearchContent from './ResearchContent';
import survey from './surveyData.json';
import { LAB_RECORDS } from './catalogue';
import { clusterObservations } from './survey';
import { composeEnquiry, prepareEnquiry, takeEnquiryDetails } from './enquiry';
afterEach(cleanup);

describe('Source-backed research',()=>{
  it('retains observations with repeated sample IDs as distinct, located source rows',()=>{
    expect(survey.observations).toHaveLength(208);
    expect(new Set(survey.observations.map(row=>row.id)).size).toBe(208);
    expect(survey.observations.filter(row=>row.sample==='S10')).toHaveLength(2);
    for(const row of survey.observations){expect(row.lon).toBeGreaterThan(42);expect(row.lon).toBeLessThan(50);expect(row.lat).toBeGreaterThan(8);expect(row.lat).toBeLessThan(12);expect(row.sourceRow).toBeGreaterThan(1);}
    expect(survey.observations.find(row=>row.sample==='B01')!.lon).toBeCloseTo(43.68155,5);
    expect(survey.followup).toHaveLength(42);
    expect(survey.routes[0].sourcePointCount).toBe(7232);
  });
  it('does not lose observations when clustering, and resolves more detail on zoom',()=>{
    const wide=clusterObservations(survey.observations,1000,1000);const close=clusterObservations(survey.observations,30,1000);
    expect(wide.reduce((sum,c)=>sum+c.rows.length,0)).toBe(208);
    expect(close.length).toBeGreaterThan(wide.length);
    expect(close.reduce((sum,c)=>sum+c.rows.length,0)).toBe(208);
  });
  it('loads and filters the existing map survey layer without changing region controls',async()=>{
    render(<SomalilandMap/>);
    fireEvent.click(screen.getByRole('button',{name:'Field observations'}));
    await waitFor(()=>expect(screen.getByRole('textbox',{name:'Search sample, project or rock'})).toBeTruthy());
    fireEvent.change(screen.getByRole('textbox',{name:'Search sample, project or rock'}),{target:{value:'B01'}});
    const row=await screen.findByRole('button',{name:/B01.*BACADO.*source row/});fireEvent.click(row);
    expect(screen.getByText(/Longitude reconciled against the original workbook/)).toBeTruthy();
    expect(screen.getByRole('button',{name:'Reset map'})).toBeTruthy();
    expect(screen.getByRole('button',{name:'Geology'})).toBeTruthy();
  });
  it('keeps original samples unassigned and describes result limitations',()=>{
    expect(LAB_RECORDS.every(record=>!('lon' in record))).toBe(true);
    render(<ResearchContent kind="projects"/>);
    expect(screen.getByText(/None has been assigned to a field point/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Project / area'),{target:{value:'darimile'}});
    expect(screen.getByRole('heading',{name:'Darimile — Gabiley'})).toBeTruthy();
  });
  it('passes enquiry context through navigation and preserves the complete message for validation',()=>{
    prepareEnquiry({project:'Simodi',mineral:'Copper'});const details=takeEnquiryDetails();
    expect(details.project).toBe('Simodi');expect(takeEnquiryDetails().project).toBe('');
    expect(composeEnquiry('Please provide technical records.',details)).toContain('Project / area: Simodi');
    expect(composeEnquiry('x'.repeat(2000),details).length).toBeGreaterThan(2000);
  });
});
